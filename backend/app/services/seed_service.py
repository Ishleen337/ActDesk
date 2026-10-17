import os
import random
import uuid
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session, selectinload

from app.models.user import User
from app.models.customer import Customer, Address
from app.models.order import Order, OrderItem, Shipment, DeliverySlot, Refund
from app.models.rule import AutonomyRule
from app.core.security import get_password_hash


# ---------------------------------------------------------------------------
# Constants (seeded data pools)
# ---------------------------------------------------------------------------
FIRST_NAMES = [
    "Aarav", "Priya", "Rohan", "Ananya", "Vikram", "Sneha", "Aditya", "Neha",
    "Kabir", "Pooja", "Arjun", "Tanvi", "Rahul", "Divya", "Siddharth", "Meera",
    "Kunal", "Riya", "Varun", "Isha", "Manish", "Kavita", "Deepak", "Shreya",
]

LAST_NAMES = [
    "Sharma", "Patel", "Iyer", "Verma", "Malhotra", "Nair", "Joshi", "Gupta",
    "Reddy", "Mehta", "Chopra", "Deshmukh", "Bose", "Kulkarni", "Aggarwal", "Singh",
]

CITIES = [
    ("Mumbai", "Maharashtra", "400001"),
    ("Bengaluru", "Karnataka", "560001"),
    ("Delhi", "Delhi", "110001"),
    ("Hyderabad", "Telangana", "500001"),
    ("Pune", "Maharashtra", "411001"),
    ("Chennai", "Tamil Nadu", "600001"),
    ("Kolkata", "West Bengal", "700001"),
    ("Ahmedabad", "Gujarat", "380001"),
    ("Jaipur", "Rajasthan", "302001"),
    ("Gurugram", "Haryana", "122001"),
]

PRODUCTS = [
    ("Organic Cold-Pressed Almond Oil (200ml)", 49900, "https://images.unsplash.com/photo-1608248597359-00508544d673?w=300"),
    ("Ceramic Dripper Artisan Coffee Kit", 129900, "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300"),
    ("Bamboo Charcoal Activated Eco Toothbrush (Pack of 4)", 29900, "https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=300"),
    ("Ergonomic Memory Foam Lumbar Support", 159900, "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=300"),
    ("Pure Linen Summer Henley - Cloud Grey", 189900, "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300"),
    ("Handmade Himalayan Saffron Radiance Elixir (30ml)", 89900, "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300"),
    ("Smart Insulated Thermal Tumbler (500ml)", 74900, "https://images.unsplash.com/photo-1577705998148-6da4f4f3963bc8?w=300"),
    ("True Wireless ANC Earbuds V2", 249900, "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300"),
    ("Cold Brew Steep Infuser Bottle", 59900, "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=300"),
    ("Natural Soy Wax Aromatherapy Candle (Oud & Bergamot)", 65000, "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=300"),
]

COURIERS = ["Delhivery", "BlueDart", "Shadowfax", "Xpressbees", "DTDC"]

ORDER_STATUSES = (
    ["delivered"] * 3
    + ["shipped"] * 2
    + ["out_for_delivery"] * 1
    + ["processing"] * 2
    + ["created"] * 1
    + ["cancelled"] * 1
)  # ~30% / 20% / 10% / 20% / 10% / 10%

TIME_WINDOWS = [
    "09:00 AM - 12:00 PM",
    "12:00 PM - 03:00 PM",
    "03:00 PM - 06:00 PM",
    "06:00 PM - 09:00 PM",
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _utcnow():
    return datetime.now(timezone.utc)


def _ensure_admin(db: Session) -> None:
    """Create or repair the Store Admin account (idempotent)."""
    admin_email = os.getenv("SEED_ADMIN_EMAIL", "admin@actdesk.com")
    admin_username = os.getenv("SEED_ADMIN_USERNAME", "Ishleen")
    admin_password = os.getenv("SEED_ADMIN_PASSWORD", "Ishleen@123")

    # Migrate legacy "admin" username → "Ishleen" once
    legacy = db.query(User).filter(User.username == "admin").first()
    if legacy and not db.query(User).filter(User.username == admin_username).first():
        legacy.username = admin_username
        db.commit()

    admin = db.query(User).filter(User.username == admin_username).first()
    if admin is None:
        admin = User(
            username=admin_username,
            email=admin_email,
            hashed_password=get_password_hash(admin_password),
            role="store_admin",
            full_name=admin_username,
            is_active=True,
        )
        db.add(admin)
        db.commit()


def _ensure_agent(db: Session) -> None:
    """Create the Support Agent account if missing (idempotent)."""
    agent_username = os.getenv("SEED_AGENT_USERNAME", "agent")
    agent_email = os.getenv("SEED_AGENT_EMAIL", "agent@actdesk.com")
    agent_password = os.getenv("SEED_AGENT_PASSWORD", "agent123")

    if db.query(User).filter(User.username == agent_username).first():
        return
    db.add(User(
        username=agent_username,
        email=agent_email,
        hashed_password=get_password_hash(agent_password),
        role="support_agent",
        full_name="Arshiya (Support Lead)",
        is_active=True,
    ))
    db.commit()


def _ensure_default_rules(db: Session) -> None:
    """Seed default autonomy rules only if a rule for that tool does not exist at all."""
    default_rules = [
        {"tool": "get_order_status", "mode": "auto", "conditions": {}},
        {"tool": "list_orders", "mode": "auto", "conditions": {}},
        {"tool": "cancel_order", "mode": "auto", "conditions": {
            "allowed_order_statuses": ["created", "processing"],
            "note": "Orders before dispatch can be cancelled automatically",
        }},
        {"tool": "issue_refund", "mode": "auto", "conditions": {
            "max_amount_paise": 50000,
            "max_refunds_per_month": 2,
            "allowed_order_statuses": ["delivered"],
            "max_days_since_delivery": 7,
        }},
        {"tool": "reschedule_delivery", "mode": "auto", "conditions": {
            "allowed_order_statuses": ["shipped", "out_for_delivery", "processing"],
        }},
        {"tool": "update_address", "mode": "auto", "conditions": {
            "allowed_order_statuses": ["created", "processing"],
        }},
        {"tool": "escalate", "mode": "auto", "conditions": {}},
    ]
    for rule_data in default_rules:
        exists = db.query(AutonomyRule).filter(
            AutonomyRule.tool == rule_data["tool"]
        ).first()
        if not exists:
            db.add(AutonomyRule(
                tool=rule_data["tool"],
                mode=rule_data["mode"],
                conditions=rule_data["conditions"],
                version=1,
                active=True,
                updated_by="system_init",
            ))
    db.commit()


def _ensure_customer_pool(db: Session, minimum: int = 120) -> list[Customer]:
    """Ensure at least `minimum` customers with addresses exist. Returns pool."""
    existing = (
        db.query(Customer)
        .options(selectinload(Customer.addresses))
        .all()
    )
    if len(existing) >= minimum:
        return existing

    # Track used phones to avoid UNIQUE collisions
    used_phones = {c.phone for c in existing}
    to_create = minimum - len(existing)
    now = _utcnow()

    for _ in range(to_create):
        # Find a unique phone suffix
        while True:
            suffix = random.randint(10000, 99999)
            phone = f"+9198765{suffix:05d}"
            if phone not in used_phones:
                used_phones.add(phone)
                break

        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        cust = Customer(
            phone=phone,
            name=f"{first} {last}",
            email=f"{first.lower()}.{last.lower()}.{suffix}@example.in",
            created_at=now - timedelta(days=random.randint(20, 180)),
        )
        db.add(cust)
        db.flush()

        city, state, pincode = random.choice(CITIES)
        db.add(Address(
            customer_id=cust.id,
            street=f"Flat {random.randint(101, 908)}, Orchid Residency, Sector {random.randint(12, 65)}",
            city=city,
            state=state,
            pincode=pincode,
            is_default=True,
        ))
        db.flush()
        existing.append(cust)

    db.commit()
    return existing


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------
def seed_database(db: Session, target_orders_count: int = 500) -> None:
    """
    Idempotent seeder.

    - Users + rules: created once, never overwritten.
    - Customers: ensured to be at least 120.
    - Orders: filled up to `target_orders_count` (never duplicated).
    """
    _ensure_admin(db)
    _ensure_agent(db)
    _ensure_default_rules(db)

    existing_count = db.query(Order).count()
    if existing_count >= target_orders_count:
        return

    customers_pool = _ensure_customer_pool(db, minimum=120)
    # Pre-load addresses to avoid N+1 in the loop
    customer_ids = [c.id for c in customers_pool]
    addresses_by_customer = {
        a.customer_id: a
        for a in db.query(Address).filter(Address.customer_id.in_(customer_ids)).all()
    }

    # Determine safe starting order number
    max_existing_id = db.query(Order.id).order_by(Order.id.desc()).first()
    start_num = 10001
    if max_existing_id and max_existing_id[0].startswith("ORD-"):
        try:
            start_num = int(max_existing_id[0].split("-")[1]) + 1
        except (ValueError, IndexError):
            pass

    orders_to_create = target_orders_count - existing_count
    now = _utcnow()

    for i in range(orders_to_create):
        cust = random.choice(customers_pool)
        addr = addresses_by_customer.get(cust.id)

        order_id = f"ORD-{start_num + i}"
        status = random.choice(ORDER_STATUSES)
        created_time = now - timedelta(
            days=random.randint(1, 45),
            hours=random.randint(1, 23),
        )

        selected_prods = random.sample(PRODUCTS, random.randint(1, 3))
        total_paise = sum(p[1] for p in selected_prods)

        order = Order(
            id=order_id,
            customer_id=cust.id,
            address_id=addr.id if addr else None,
            status=status,
            total_paise=total_paise,
            currency="INR",
            created_at=created_time,
            updated_at=created_time,
        )
        db.add(order)
        db.flush()

        for title, price_paise, image_url in selected_prods:
            db.add(OrderItem(
                order_id=order.id,
                title=title,
                quantity=1,
                price_paise=price_paise,
                image_url=image_url,
            ))

        # Shipment only for shipped / out_for_delivery / delivered / cancelled
        if status in ("shipped", "out_for_delivery", "delivered", "cancelled"):
            courier = random.choice(COURIERS)
            city = addr.city if addr else "Delhi"
            loc = city if status in ("out_for_delivery", "delivered") else "Central Hub, Nagpur"
            db.add(Shipment(
                order_id=order.id,
                tracking_number=f"{courier[:3].upper()}{random.randint(10**7, 10**8 - 1)}",
                courier=courier,
                status={
                    "delivered": "delivered",
                    "out_for_delivery": "out_for_delivery",
                }.get(status, "in_transit"),
                estimated_delivery=(created_time + timedelta(days=4)).strftime("%b %d, %Y"),
                current_location=loc,
                updated_at=created_time + timedelta(days=2),
            ))

        # Delivery slot only for non-cancelled, non-delivered orders
        if status not in ("cancelled", "delivered"):
            db.add(DeliverySlot(
                order_id=order.id,
                slot_date=(created_time + timedelta(days=3)).strftime("%Y-%m-%d"),
                time_window=random.choice(TIME_WINDOWS),
                status="booked",
                updated_at=created_time,
            ))

        # Historical refund for realistic refund-count checks
        if status == "delivered" and random.random() < 0.08:
            db.add(Refund(
                order_id=order.id,
                customer_id=cust.id,
                amount_paise=random.choice([29900, 49900, 65000]),
                reason="Minor cosmetic packaging damage",
                status="processed",
                idempotency_key=f"seed_refund_{order_id}_{uuid.uuid4().hex[:8]}",
                created_at=created_time + timedelta(days=5),
            ))

        if (i + 1) % 100 == 0:
            db.commit()

    db.commit()