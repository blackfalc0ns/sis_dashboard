"use client";

import { useState } from "react";
import { Input, TextArea, Select, DatePicker } from "@/components/ui/input";
import { Mail, Lock, Search, User, Phone } from "lucide-react";

export default function InputExamples() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [country, setCountry] = useState("");
  const [grade, setGrade] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [emailError, setEmailError] = useState("");

  const validateEmail = (value: string) => {
    if (!value) {
      setEmailError("Email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setEmailError("Invalid email format");
    } else {
      setEmailError("");
    }
  };

  const countryOptions = [
    { value: "sa", label: "Saudi Arabia" },
    { value: "ae", label: "United Arab Emirates" },
    { value: "eg", label: "Egypt" },
    { value: "jo", label: "Jordan" },
  ];

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Input Components Examples
      </h1>

      {/* Basic Input */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">1. Basic Input</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Full Name" placeholder="Enter your name" required />
          <Input
            label="Email"
            type="email"
            placeholder="example@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              validateEmail(e.target.value);
            }}
            error={emailError}
            required
          />
        </div>
      </section>

      {/* Input with Icons */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          2. Input with Icons
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="example@email.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter password"
            leftIcon={<Lock className="w-4 h-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label="Search"
            type="text"
            placeholder="Search..."
            leftIcon={<Search className="w-4 h-4" />}
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="+966 XX XXX XXXX"
            leftIcon={<Phone className="w-4 h-4" />}
          />
        </div>
      </section>

      {/* Input Sizes */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">3. Input Sizes</h2>
        <div className="space-y-3">
          <Input label="Small Input" placeholder="Small size" inputSize="sm" />
          <Input
            label="Medium Input (Default)"
            placeholder="Medium size"
            inputSize="md"
          />
          <Input label="Large Input" placeholder="Large size" inputSize="lg" />
        </div>
      </section>

      {/* Input Variants */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          4. Input Variants
        </h2>
        <div className="space-y-3">
          <Input
            label="Default Variant"
            placeholder="Default style"
            variant="default"
          />
          <Input
            label="Filled Variant"
            placeholder="Filled style"
            variant="filled"
          />
          <Input
            label="Outlined Variant"
            placeholder="Outlined style"
            variant="outlined"
          />
        </div>
      </section>

      {/* Input States */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">5. Input States</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Normal State" placeholder="Enter text" />
          <Input
            label="With Error"
            placeholder="Enter text"
            error="This field is required"
          />
          <Input
            label="Disabled State"
            placeholder="Disabled input"
            disabled
            value="Cannot edit"
          />
          <Input
            label="With Helper Text"
            placeholder="Enter text"
            helperText="This is a helpful hint"
          />
        </div>
      </section>

      {/* TextArea */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">6. TextArea</h2>
        <div className="space-y-3">
          <TextArea
            label="Bio"
            placeholder="Tell us about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            helperText={`${bio.length}/500 characters`}
          />
          <TextArea
            label="Comments"
            placeholder="Enter your comments"
            rows={3}
            resize="none"
          />
          <TextArea
            label="With Error"
            placeholder="Enter text"
            error="This field cannot be empty"
            rows={3}
          />
        </div>
      </section>

      {/* Select */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">7. Select</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Country"
            placeholder="Select a country"
            options={countryOptions}
            value={country}
            onChange={(value) => setCountry(value)}
            required
          />
          <Select
            label="Grade"
            placeholder="Select grade"
            options={[
              { value: "1", label: "Grade 1" },
              { value: "2", label: "Grade 2" },
              { value: "3", label: "Grade 3" },
              { value: "4", label: "Grade 4" },
            ]}
            value={grade}
            onChange={(value) => setGrade(value)}
            required
          />
          <Select
            label="With Error"
            placeholder="Select option"
            error="Please select an option"
            options={[
              { value: "1", label: "Option 1" },
              { value: "2", label: "Option 2" },
            ]}
          />
          <Select
            label="Disabled"
            placeholder="Cannot select"
            disabled
            options={countryOptions}
          />
        </div>
      </section>

      {/* DatePicker */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">8. DatePicker</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DatePicker
            label="Birth Date"
            placeholder="Select date"
            value={birthDate}
            onChange={(date) => setBirthDate(date)}
            required
          />
          <DatePicker
            label="Future Date Only"
            placeholder="Select future date"
            disablePast
          />
          <DatePicker
            label="Past Date Only"
            placeholder="Select past date"
            disableFuture
          />
          <DatePicker
            label="With Error"
            placeholder="Select date"
            error="Date is required"
          />
          <DatePicker
            label="Disabled"
            placeholder="Cannot select"
            disabled
            value={new Date()}
          />
          <DatePicker
            label="With Helper Text"
            placeholder="Select date"
            helperText="Choose your preferred date"
          />
        </div>
      </section>

      {/* Form Example */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">
          9. Complete Form Example
        </h2>
        <form className="space-y-4 p-6 bg-gray-50 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="First Name"
              placeholder="John"
              leftIcon={<User className="w-4 h-4" />}
              required
            />
            <Input
              label="Last Name"
              placeholder="Doe"
              leftIcon={<User className="w-4 h-4" />}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="john@example.com"
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="+966 XX XXX XXXX"
              leftIcon={<Phone className="w-4 h-4" />}
              required
            />
            <Select
              label="Country"
              placeholder="Select country"
              options={countryOptions}
              required
            />
            <Select
              label="Grade"
              placeholder="Select grade"
              options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => ({
                value: g.toString(),
                label: `Grade ${g}`,
              }))}
              required
            />
            <DatePicker
              label="Birth Date"
              placeholder="Select birth date"
              disableFuture
              required
            />
            <DatePicker
              label="Enrollment Date"
              placeholder="Select enrollment date"
              required
            />
          </div>
          <TextArea
            label="Additional Notes"
            placeholder="Any additional information..."
            rows={4}
          />
          <button
            type="submit"
            className="w-full px-4 py-2.5 bg-[#036b80] hover:bg-hover text-white rounded-lg font-medium transition-colors"
          >
            Submit Form
          </button>
        </form>
      </section>
    </div>
  );
}
