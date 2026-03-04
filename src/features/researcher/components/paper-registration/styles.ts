import type React from "react";

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  background: "rgba(30,28,24,0.8)",
  border: "1px solid rgba(120,110,95,0.25)",
  borderRadius: 4,
  color: "#d4ccc0",
  fontFamily: "'Georgia', serif",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

export const labelStyle: React.CSSProperties = {
  fontSize: 10,
  color: "#8a8070",
  marginBottom: 6,
  display: "block",
};

export const sectionStyle: React.CSSProperties = {
  background: "rgba(45,42,38,0.5)",
  border: "1px solid rgba(120,110,95,0.2)",
  borderRadius: 8,
  padding: 24,
  marginBottom: 20,
};

export const subsectionStyle: React.CSSProperties = {
  padding: 18,
  background: "rgba(30,28,24,0.4)",
  borderRadius: 6,
  border: "1px solid rgba(120,110,95,0.1)",
};

export const errorStyle: React.CSSProperties = {
  color: "#d4645a",
  fontSize: 10,
  marginTop: 4,
};

export const errorBorder = "1px solid rgba(212,100,90,0.4)";
