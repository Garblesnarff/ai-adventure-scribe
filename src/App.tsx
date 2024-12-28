import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import CharacterSheet from './components/character-sheet/CharacterSheet';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/character/:id" element={<CharacterSheet />} />
      </Routes>
    </Router>
  );
}

export default App;