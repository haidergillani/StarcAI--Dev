import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import searchIcon from "../../assets/search-icon.svg";
import debounce from 'lodash/debounce';

interface SearchBarProps {
  onSearchComplete: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearchComplete }) => {
  const [query, setQuery] = useState("");
  
  const debouncedSearchRef = useRef(
    debounce((value: string) => {
      onSearchComplete(value);
    }, 500)
  );

  useEffect(() => {
    debouncedSearchRef.current = debounce((value: string) => {
      onSearchComplete(value);
    }, 500);
  }, [onSearchComplete]);

  useEffect(() => {
    return () => {
      debouncedSearchRef.current.cancel();
    };
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setQuery(newValue);
    debouncedSearchRef.current(newValue);
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearchComplete(query);
  };

  return (
    <form onSubmit={handleSearch} className="flex w-full space-x-16">
      <div className="flex flex-grow space-x-12 rounded bg-background pb-12 pl-24 pr-24 pt-12">
        <Image 
          src={searchIcon as string} 
          alt="search"
          width={24}
          height={24}
        />
        <input
          type="text"
          className="w-full bg-transparent focus:outline-none"
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