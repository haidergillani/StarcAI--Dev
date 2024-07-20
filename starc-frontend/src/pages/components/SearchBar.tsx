import React, { useState } from "react";
import axios, { AxiosResponse } from "axios";
import Image from "next/image";
import searchIcon from "../../assets/search-icon.svg";

interface SearchBarProps {
  onSearchComplete: (response: AxiosResponse<any>) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearchComplete }) => {
  const apiUrl = process.env.NEXT_PUBLIC_REACT_APP_API_URL;
  const [query, setQuery] = useState("");

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    // sends text in field as query to search backend
    event.preventDefault();
    try {
      const authToken = localStorage.getItem("authToken");
      const response = await axios.get(`https://starcai.onrender.com/api/search`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        params: {
          q: query,
        },
      });
      // Pass the entire response to the parent component
      onSearchComplete(response);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex w-full space-x-16">
      <div className="flex flex-grow space-x-12 rounded bg-background pb-12 pl-24 pr-24 pt-12">
        <Image src={searchIcon} alt="search" />
        {/* text input field */}
        <input
          type="text"
          className="w-full bg-transparent"
          value={query}
          onChange={handleInputChange}
          placeholder="Document name or keywords..."
        />
      </div>
      <button
        type="submit"
        className="rounded bg-primary-purple pb-12 pl-24 pr-24 pt-12 text-sm_3 font-semibold text-white"
      >
        Search
      </button>
    </form>
  );
};

export default SearchBar;
