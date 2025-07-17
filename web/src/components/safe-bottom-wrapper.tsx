import React, { useEffect, useState } from "react";

export const SafeBottomWrapper: React.FC<React.PropsWithChildren<object>> = ({
  children,
}) => {
  const [androidBottom, setAndroidBottom] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      const innerHeight = window.innerHeight;
      const clientHeight = document.documentElement.clientHeight;
      const safeGap = Math.max(innerHeight - clientHeight, 0);
      setAndroidBottom(safeGap > 0 ? safeGap : 0);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className="pb-safe-bottom"
      style={{
        paddingBottom: androidBottom ? androidBottom + "px" : undefined,
      }}
    >
      {children}
    </div>
  );
};
