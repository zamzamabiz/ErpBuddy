import React from "react";

export default function StatCard({ title, value }) {
  return (
    <div className="bg-white shadow-md rounded-xl p-6">
      <h2 className="text-gray-500">{title}</h2>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
