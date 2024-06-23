import { GSankeyDiagram } from './GSankeyDiagram.js';

const sankeyData = [
    { from: 'Online', to: 'Apps', value: 9 },
    { from: 'Career Fair', to: 'Apps', value: 13 },
    { from: 'Network', to: 'Apps', value: 9 },
    { from: 'Apps', to: 'No Response', value: 10 },
    { from: 'Apps', to: 'Round 1', value: 17 },
    { from: 'Apps', to: 'Code Challenge', value: 7 },
    { from: 'Round 1', to: 'Round 2', value: 6 },
    { from: 'Round 1', to: 'Final Round', value: 8 },
    { from: 'Round 1', to: 'Rejected', value: 11 },
    { from: 'Final Round', to: 'Offers', value: 6 },
    { from: 'Final Round', to: 'I rejected them', value: 4 }
];

const sankeyDiagram = new GSankeyDiagram();
sankeyDiagram.drawSankey(sankeyData, { width: 1024, height: 720, containerId: "chartContainer" });
