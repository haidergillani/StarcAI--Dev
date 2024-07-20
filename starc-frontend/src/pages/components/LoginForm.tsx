import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";

export default function LoginForm() {
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const router = useRouter();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    // update stored user values when fields edited
    if (name === "loginIdentifier") setLoginIdentifier(value);
    if (name === "password") setPassword(value);
  };

  const isFormValid = () => {
    // check if all fields are filled
    return loginIdentifier && password;
  };

  const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isFormValid()) {
      try {
        const response = await axios.post("https://starcai.onrender.com/auth/login", {
          login_identifier: loginIdentifier,
          password,
        });

        console.log("Login Response:", response.data);

        // Saving the token in local storage
        const accessToken = response.data.access_token;
        if (accessToken) {
          localStorage.setItem("authToken", accessToken);
          router.push("/docs"); // Redirecting to '/docs' page after successful login
        } else {
          console.error("No access token received");
        }
      } catch (error) {
        setLoginError("Account not found");
        console.error(error);
      }
    }
  };

  return (
    <div className="flex h-screen flex-col items-center space-y-42 bg-white pb-150 pl-42 pr-42 pt-150">
      <div className="flex flex-col items-center">
        <div className="text-base font-normal text-black">WELCOME BACK</div>
        <div className="text-lg_1 font-medium text-black">
          Log In to Your Account
        </div>
      </div>
      <form className="flex flex-col space-y-4">
        {/* show unsuccessful login errors */}
        {loginError && <div className="text-red-500">{loginError}</div>}
        {/* username or email field */}
        <input
          type="loginIdentifier"
          name="loginIdentifier"
          placeholder="Username or Email"
          value={loginIdentifier}
          onChange={handleInputChange}
          className="w-380 rounded border bg-background p-16"
          required
        />
        {/* password field */}
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={password}
          onChange={handleInputChange}
          className="w-380 rounded border bg-background p-16"
          required
        />
        <button
          type="submit"
          disabled={!isFormValid()}
          onClick={handleSubmit}
          className="w-380 rounded border bg-gray-70 p-16 text-sm_3 font-bold text-white"
        >
          CONTINUE
        </button>
      </form>
      {/* Link to navigate to the register page */}
      <div className="flex space-x-6 text-base text-black">
        <div className="font-normal">New User?</div>
        <Link className="font-bold" href="/register">
          SIGN UP HERE
        </Link>
      </div>
    </div>
  );
}
