import Link from "next/link";

export default function IndexPage() {
  return (
    <div>
      <div>
        <div>
          <Link href="/home">Go to Home Page</Link>
        </div>
        <div>
          <Link href="/login">Go to Login Page</Link>
        </div>
      </div>
      <div>
        <Link href="/docs">Go to Docs Page</Link>
      </div>
      <div>
        <Link href="/register">Go to Registration Page</Link>
      </div>
    </div>
  );
}
