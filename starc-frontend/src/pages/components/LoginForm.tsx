import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";
import Spinner from "./Spinner";
import { storeTokens, api } from "../../utils/auth";

interface AuthResponse {
  access_token: string;
  refresh_token?: string;
}

export default function LoginForm() {
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
        setIsLoading(true);
        const response = await api.post<AuthResponse>(`/auth/login`, {
          login_identifier: loginIdentifier,
          password,
        });

        if (response.data.access_token) {
          storeTokens(response.data);
          await new Promise(resolve => setTimeout(resolve, 10000));
          void router.push("/docs");
        } else {
          console.error("No access token received");
          setIsLoading(false);
        }
      } catch (error) {
        setLoginError("Account not found");
        console.error(error);
        setIsLoading(false);
      }
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    try {
      if (!response.credential) {
        throw new Error('No credential received');
      }

      setIsLoading(true);
      const res = await api.post<AuthResponse>(`/auth/google`, {
        token: response.credential,
      });

      if (res.data.access_token) {
        storeTokens(res.data);
        await new Promise(resolve => setTimeout(resolve, 10000));
        void router.push("/docs");
      } else {
        console.error("No access token received");
        setIsLoading(false);
      }
    } catch (error) {
      setLoginError("Google login failed");
      console.error(error);
      setIsLoading(false);
    }
  };

  const handleGoogleFailure = () => {
    console.error("Google login failed");
    setLoginError("Google login failed");
  };

  return (
    <div className="flex h-screen flex-col items-center space-y-42 bg-white dark:bg-gray-900 pb-150 pl-42 pr-42 pt-[100px]">
      {isLoading ? (
        <div className="flex h-full items-center justify-center">
          <Spinner duration={10000} onComplete={() => setIsLoading(false)} />
        </div>
      ) : (
        <>
          <div className="flex flex-col items-center">
            <div className="text-base font-normal text-gray-800 dark:text-gray-200">WELCOME BACK</div>
            <div className="text-lg_1 font-medium text-gray-800 dark:text-gray-200">
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
              className="w-380 rounded border dark:border-gray-700 bg-background dark:bg-gray-700 p-16 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={password}
              onChange={handleInputChange}
              className="w-380 rounded border dark:border-gray-700 bg-background dark:bg-gray-700 p-16 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
              required
            />
            <button
              type="submit"
              disabled={!isFormValid()}
              onClick={handleSubmit}
              className="w-380 rounded border bg-primary-purple p-16 text-sm_3 font-bold text-white hover:bg-primary-purple-hover"
            >
              CONTINUE
            </button>
          </form>
          <div className="flex items-center my-4 w-full">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
            <span className="mx-4 text-gray-500 dark:text-gray-400">or</span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
          </div>
          <div className="flex flex-col items-center space-y-4">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleFailure}
            />
          </div>
          <div className="flex space-x-6 text-base text-gray-800 dark:text-gray-200">
            <div className="font-normal">New User?</div>
            <Link className="font-bold text-indigo-800 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300" href="/register">
              SIGN UP HERE
            </Link>
          </div>
        </>
      )}
    </div>
  );
}