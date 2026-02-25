"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronDown } from "react-icons/fa";

export default function CustomSelect({ value, options, onChange, placeholder, className = false }) {
    const [open, setOpen] = useState(false);

    const selected = options.find(o => o.value === value);

    return (
        <div className={`relative min-w-[180px] max-w-full w-fit ${className ? className : ''}`}>

            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="w-full border px-4 py-2 rounded-md bg-white flex items-center justify-between hover:shadow transition"
            >
                <span className={selected ? "text-black" : "text-gray-400"}>
                    {selected?.label || placeholder}
                </span>
                <FaChevronDown className={`transition ${open ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-20 mt-2 w-full bg-white border rounded-md shadow-lg overflow-hidden max-h-72 overflow-y-auto"
                    >
                        {options.map(opt => (
                            <div
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setOpen(false);
                                }}
                                className={`px-4 py-2 cursor-pointer text-xs md:text-[15px] hover:bg-gray-100 transition ${opt.value === value ? "bg-gray-100 font-medium" : ""
                                    }`}
                            >
                                {opt.label}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
