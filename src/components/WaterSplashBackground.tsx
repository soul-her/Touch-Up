const WaterSplashBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {/* 🌊 Slow moving background */}
      <div
        className="
          absolute inset-0
          bg-[url('/water-bg (2).jfif')]
          bg-cover bg-center
          animate-bg-move
        "
      />

      {/* 💧 Ripple overlay */}
      <div
        className="
          absolute inset-0
          bg-[url('/ripple.jpg')]
          bg-repeat
          opacity-20
          animate-ripple
          pointer-events-none
        "
      />

      {/* Optional dark overlay for readability */}
      <div className="absolute inset-0 bg-black/20" />
    </div>
  );
};

export default WaterSplashBackground;
