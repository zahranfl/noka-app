function Button({
  children,
  variant = "green",
  size,
  className = "",
  onClick,
  type = "button",
  ...rest
}) {
  return (
    <button
      type={type}
      className={`btn btn-${variant} ${size === "sm" ? "btn-sm" : ""} ${className}`}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Button;
