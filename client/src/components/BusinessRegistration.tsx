"use client";

import React, { useState } from "react";
import Input from "./Input";
import Select, { SingleValue } from "react-select";
import countries from "world-countries";

type Props = {};
type Option = {
  value: string;
  label: string;
};

const countryOptions: Option[] = countries.map((country) => ({
  value: country.cca2,
  label: country.name.common,
}));

const BusinessRegistration = (props: Props) => {
  const [businessName, setBusinessName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selected, setSelected] = useState<Option | null>(null);
  const [errors, setErrors] = useState({
    businessName: "",
    businessEmail: "",
    password: "",
  });

  const handleChange = (value: SingleValue<Option>) => {
    setSelected(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    console.log("Form submitted:", {
      businessName,
      businessEmail,
      password,
      selected,
    });
    e.preventDefault();

    const newErrors = {
      businessName: "",
      businessEmail: "",
      password: "",
    };

    if (!businessName.trim()) {
      newErrors.businessName = "Business name is required.";
    } else {
      newErrors.businessName = "";
    }
    if (!businessEmail.trim()) {
      newErrors.businessEmail = "Business email is required.";
    } else {
      newErrors.businessEmail = "";
    }
    if (!password.trim()) {
      newErrors.password = "Password is required.";
    } else {
      newErrors.password = "";
    }
    if (businessEmail) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(businessEmail)) {
        newErrors.businessEmail = "Please enter a valid email address.";
      } else {
        newErrors.businessEmail = "";
      }
    }
    if (password) {
      if (password.length < 6) {
        newErrors.password = "Password must be at least 6 characters long.";
      } else {
        newErrors.password = "";
      }
    }
    setErrors(newErrors);
  };

  return (
    <div className="md:px-10">
      <p className="text-xs text-gray-500 mb-4 text-center">
        Please fill in the details below to register your business.
      </p>
      <form onSubmit={handleSubmit}>
        <Input
          id="business-name"
          label="Business Name"
          placeholder="Type your Business Name"
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          error={errors.businessName}
        />
        <Input
          id="business-email"
          label="Business Email"
          placeholder="Type your Business Email"
          value={businessEmail}
          onChange={(e) => setBusinessEmail(e.target.value)}
          error={errors.businessEmail}
          type="email"
        />
        <Input
          id="password"
          label="Password"
          placeholder="Type your Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          type="password"
        />
        <div className="relative w-full">
          <label className="absolute -top-2 left-3 px-1 text-xs bg-white text-black z-10">
            Select Country
          </label>
          <Select
            options={countryOptions}
            value={selected}
            onChange={(value) => handleChange(value)}
            className="md:text-xs rounded-md shadow-sm placeholder:text-gray-400 "
            classNamePrefix="react-select"
            placeholder="Where is your business registered?"
          />
          <p className="bg-blue-100 p-2 rounded-xl text-xs text-blue-800 mt-2">
            If your business isn't registered, select your country of residence.
          </p>
        </div>
        <p className="text-xs my-3 font-[family-name:var(--font-inter)]">
          By selecting Create business account, you agree to our User Agreement
          and acknowledge reading our User Privacy Notice
        </p>
        <div className="flex items-center justify-center mt-4">
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold text-white bg-[#5187f6] rounded-md cursor-pointer hover:bg-[#5187f8] focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Register Business Account
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessRegistration;
