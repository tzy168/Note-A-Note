import React from 'react';
import { useParams } from 'react-router-dom';

const Folder = () => {
  const { id } = useParams();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-text">Folder: {id}</h1>
      <div className="p-8 text-center text-gray-500 bg-white rounded-xl shadow glass">
        <p>No notes in this folder yet.</p>
      </div>
    </div>
  );
};

export default Folder;