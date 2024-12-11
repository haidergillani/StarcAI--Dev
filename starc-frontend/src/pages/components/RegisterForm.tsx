import React, { useState, useEffect } from "react";
import axios from "axios";
import type { AxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/router";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";

interface ErrorResponse {
  message: string;
}

interface AuthResponse {
  access_token: string;
}

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const router = useRouter();

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    // Updates stored user values when fields edited
    setTouched({ ...touched, [name]: true });
    if (name === "username") setUsername(value);
    if (name === "email") setEmail(value);
    if (name === "password") setPassword(value);
    if (name === "confirmPassword") setConfirmPassword(value);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  useEffect(() => {
    // touched boolean ensures errors are only shown if the user has engaged with the field
    setErrors({
      username:
        touched.username && username.trim() === "" ? "Name is required" : "",
      email:
        touched.email && (!email || !validateEmail(email))
          ? !email
            ? "Email is required"
            : "Not a valid email"
          : "",
      password:
        touched.password && (!password || password.length < 8)
          ? !password
            ? "Password is required"
            : "Password must be at least 8 characters"
          : "",
      confirmPassword:
        touched.confirmPassword &&
        (!confirmPassword || confirmPassword !== password)
          ? !confirmPassword
            ? "Confirmation password is required"
            : "Passwords do not match"
          : "",
    });
  }, [username, email, password, confirmPassword, touched]);

  const isFormValid = () => {
    // Check there are no input errors and all fields are filled
    return (
      username &&
      email &&
      password &&
      confirmPassword &&
      !errors.username &&
      !errors.email &&
      !errors.password &&
      !errors.confirmPassword
    );
  };

  const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setTouched({
      username: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    if (isFormValid()) {
      try {
        const response = await axios.post(
          "http://127.0.0.1:2000/auth/register",
          {
            username,
            email,
            password,
          },
        );
        console.log(response.data);
        void router.push("/login");
      } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.data) {
          const errorResponse = axiosError.response.data as ErrorResponse;
          setRegisterError(errorResponse.message);
        } else {
          setRegisterError("Registration unsuccessful");
        }
      }
    }
  };

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    try {
      console.log(response);
      if (!response.credential) {
        throw new Error('No credential received');
      }
      
      const res = await axios.post<AuthResponse>("http://127.0.0.1:2000/auth/google", {
        credential: response.credential,
      });

      const accessToken = res.data.access_token;
      if (accessToken) {
        localStorage.setItem("authToken", accessToken);
        void router.push("/docs");
      } else {
        console.error("No access token received");
      }
    } catch (error) {
      setRegisterError("Google sign-up failed");
      console.error(error);
    }
  };

  const handleGoogleFailure = () => {
    console.error("Google sign-up error");
    setRegisterError("Google sign-up failed");
  };

  return (
    <div className="flex h-screen flex-col items-center space-y-42 bg-white pb-150 pl-42 pr-42 pt-[30px]">
      <div className="flex flex-col items-center">
        <div className="text-base font-normal text-black">WELCOME!</div>
        <div className="text-lg_1 font-medium text-black">
          Create a New Account
        </div>
      </div>
      <form className="flex flex-col space-y-4">
        {/* Prints unsuccessful registration alert */}
        {registerError && <div className="text-red-500">{registerError}</div>}
        {/* username field and error */}
        <div>
          <input
            type="username"
            name="username"
            placeholder="Username"
            value={username}
            onChange={handleInputChange}
            className="w-380 rounded border bg-background p-16"
            required
          />
          {errors.username && (
            <div className="text-red-500">{errors.username}</div>
          )}
        </div>
        {/* email field and error */}
        <div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={email}
            onChange={handleInputChange}
            className="w-380 rounded border bg-background p-16"
            required
          />
          {errors.email && <div className="text-red-500">{errors.email}</div>}
        </div>
        {/* password field and error */}
        <div>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={password}
            onChange={handleInputChange}
            className="w-380 rounded border bg-background p-16"
            required
          />
          {errors.password && (
            <div className="text-red-500">{errors.password}</div>
          )}
        </div>
        {/* confirm password field and error */}
        <div>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={handleInputChange}
            className="w-380 rounded border bg-background p-16"
            required
          />
          {errors.confirmPassword && (
            <div className="text-red-500">{errors.confirmPassword}</div>
          )}
        </div>
        <button
          type="submit"
          disabled={!isFormValid()}
          onClick={handleSubmit}
          className="w-380 rounded border bg-gray-70 p-16 text-sm_3 font-bold text-white"
        >
          CREATE ACCOUNT
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
      {/* Navigate to login page */}
      <div className="flex space-x-6 text-base text-black">
        <div className="font-normal">Already have an account?</div>
        <Link className="font-bold" href="/login">
          LOGIN
        </Link>
      </div>
    </div>
  );
}