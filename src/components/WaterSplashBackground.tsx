// src/components/WaterSplashBackground.tsx
import React from "react";

/**
 * WaterSplashBackground
 * Renders the animated background layers used in your HTML prototype.
 * This component uses CSS classes you already added (water-splash-bg, floating-drop, etc).
 *
 * Make sure the CSS for those classes is included in a global stylesheet
 * (e.g. index.css / App.css) or in a Tailwind + custom CSS file.
 */
const WaterSplashBackground: React.FC = () => {
  return (
    <>
      {/* main background gradients */}
      <div className="water-splash-bg" aria-hidden="true" />

      {/* decorative floating drops (positions can be adjusted via CSS or utility classes) */}
      <div className="floating-drop top-1/4 left-3/4" aria-hidden="true" />
      <div className="floating-drop floating-drop-2" aria-hidden="true" />
    </>
  );
};

export default WaterSplashBackground;
