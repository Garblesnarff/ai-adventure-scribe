import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import CharacterSheet from './components/character-sheet/CharacterSheet';
import CharacterList from './components/character-list/CharacterList';
import CharacterWizard from './components/character-creation/CharacterWizard';
import CampaignWizard from './components/campaign-creation/CampaignWizard';
import CampaignView from './components/campaign-view/CampaignView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/characters" element={<CharacterList />} />
        <Route path="/characters/create" element={<CharacterWizard />} />
        <Route path="/character/:id" element={<CharacterSheet />} />
        <Route path="/campaigns/create" element={<CampaignWizard />} />
        <Route path="/campaign/:id" element={<CampaignView />} />
      </Routes>
    </Router>
  );
}

export default App;