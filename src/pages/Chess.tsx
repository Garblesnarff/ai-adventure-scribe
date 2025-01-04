import React from 'react';
import { ChessGame } from '@/components/chess/ChessGame';

const ChessPage: React.FC = () => {
  return (
    <div className="w-full h-screen">
      <ChessGame />
    </div>
  );
};

export default ChessPage;