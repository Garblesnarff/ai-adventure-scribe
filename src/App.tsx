import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import CharacterSheet from './components/character-sheet/CharacterSheet';
import CharacterList from './components/character-list/CharacterList';
import CharacterWizard from './components/character-creation/CharacterWizard';
import CampaignWizard from './components/campaign-creation/CampaignWizard';
import CampaignView from './components/campaign-view/CampaignView';
import Navigation from './components/layout/Navigation';
import Breadcrumbs from './components/layout/Breadcrumbs';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Navigation />
        <Breadcrumbs />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/characters" element={<CharacterList />} />
            <Route path="/characters/create" element={<CharacterWizard />} />
            <Route path="/character/:id" element={<CharacterSheet />} />
            <Route path="/campaigns/create" element={<CampaignWizard />} />
            <Route path="/campaign/:id" element={<CampaignView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;