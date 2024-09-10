import React, { useState, useCallback } from "react";
import Image from "next/image";
import searchIcon from "../../assets/search-icon.svg";

interface SearchBarProps {
  onSearchComplete: (query: string) => void;
}

const debounce = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};

const SearchBar: React.FC<SearchBarProps> = ({ onSearchComplete }) => {
  const [query, setQuery] = useState("");

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    debouncedSearch(event.target.value);
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearchComplete(query);
  };

  const debouncedSearch = useCallback(debounce(onSearchComplete, 300), []);

  return (
    <form onSubmit={handleSearch} className="flex w-full space-x-16">
      <div className="flex flex-grow space-x-12 rounded bg-background pb-12 pl-24 pr-24 pt-12">
        <Image src={searchIcon} alt="search" />
        <input
          type="text"
          className="w-full bg-transparent focus:outline-none" // Add focus:outline-none to remove the black box
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