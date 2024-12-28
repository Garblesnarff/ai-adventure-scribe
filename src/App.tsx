import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import CharacterSheet from './components/character-sheet/CharacterSheet';
import CharacterList from './components/character-list/CharacterList';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/characters" element={<CharacterList />} />
        <Route path="/character/:id" element={<CharacterSheet />} />
      </Routes>
    </Router>
  );
}

export default App;