import type { ReactNode, CSSProperties } from "react";

export const Card = ({
  children,
  style,
}: {
  children: ReactNode;
  style?: CSSProperties;
}) => (
  <div
    style={{
      background: "#1e293b",
      border: "1px solid #334155",
      borderRadius: 10,
      padding: 20,
      ...style,
    }}
  >
    {children}
  </div>
);
