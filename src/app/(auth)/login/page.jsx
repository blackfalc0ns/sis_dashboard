export default function Login() {
  fetch("/api/auth/login", {
    next: { revalidate: 0 },
    method: "POST",
  });
  return (
    <div>
      <h1>Login</h1>
    </div>
  );
}
