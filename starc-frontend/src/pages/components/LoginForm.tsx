import React, { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";

interface AuthResponse {
  access_token: string;
}

export default function LoginForm() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:2000';
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const router = useRouter();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    if (name === "loginIdentifier") setLoginIdentifier(value);
    if (name === "password") setPassword(value);
  };

  const isFormValid = () => {
    return loginIdentifier && password;
  };

  const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isFormValid()) {
      try {
        const response = await axios.post<AuthResponse>(`${API_URL}/auth/login`, {
          login_identifier: loginIdentifier,
          password,
        });

        const accessToken = response.data.access_token;
        if (accessToken) {
          localStorage.setItem("authToken", accessToken);
          void router.push("/docs");
        } else {
          console.error("No access token received");
        }
      } catch (error) {
        setLoginError("Account not found");
        console.error(error);
      }
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    try {
      if (!response.credential) {
        throw new Error('No credential received');
      }

      const res = await axios.post<AuthResponse>(`${API_URL}/auth/google`, {
        token: response.credential,
      });

      const accessToken = res.data.access_token;
      if (accessToken) {
        localStorage.setItem("authToken", accessToken);
        void router.push("/docs");
      } else {
        console.error("No access token received");
      }
    } catch (error) {
      setLoginError("Google login failed");
      console.error(error);
    }
  };

  const handleGoogleFailure = () => {
    console.error("Google login failed");
    setLoginError("Google login failed");
  };

  return (
    <div className="flex h-screen flex-col items-center space-y-42 bg-white pb-150 pl-42 pr-42 pt-[100px]">
      <div className="flex flex-col items-center">
        <div className="text-base font-normal text-black">WELCOME BACK</div>
        <div className="text-lg_1 font-medium text-black">
          Log In to Your Account
        </div>
      </div>
      <form className="flex flex-col space-y-4">
        {loginError && <div className="text-red-500">{loginError}</div>}
        <input
          type="loginIdentifier"
          name="loginIdentifier"
          placeholder="Username or Email"
          value={loginIdentifier}
          onChange={handleInputChange}
          className="w-380 rounded border bg-background p-16"
          required
        />
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
      <div className="flex items-center my-4 w-full">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="mx-4 text-gray-500">or</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
      <div className="flex flex-col items-center space-y-4">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleFailure}
        />
      </div>
      <div className="flex space-x-6 text-base text-black">
        <div className="font-normal">New User?</div>
        <Link className="font-bold" href="/register">
          SIGN UP HERE
        </Link>
      </div>
    </div>
  );
}