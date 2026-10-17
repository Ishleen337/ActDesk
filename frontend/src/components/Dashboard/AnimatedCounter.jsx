// import React, { useEffect, useState } from 'react';

// export default function AnimatedCounter({ 
//   value, 
//   duration = 900, 
//   suffix = '', 
//   prefix = '',
//   decimals = 0 
// }) {
//   const [display, setDisplay] = useState(0);

//   useEffect(() => {
//     const startTime = Date.now();
//     const startValue = 0;
//     const endValue = typeof value === 'number' ? value : parseFloat(value) || 0;

//     const tick = () => {
//       const elapsed = Date.now() - startTime;
//       const progress = Math.min(elapsed / duration, 1);
//       const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
//       const current = startValue + (endValue - startValue) * eased;
//       setDisplay(current);

//       if (progress < 1) {
//         requestAnimationFrame(tick);
//       } else {
//         setDisplay(endValue);
//       }
//     };

//     requestAnimationFrame(tick);
//   }, [value, duration]);

//   return (
//     <span>
//       {prefix}
//       {display.toFixed(decimals)}
//       {suffix}
//     </span>
//   );
// }