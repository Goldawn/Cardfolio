import { saveAs } from 'file-saver';

export const exportToJSON = (data, filename = 'cards.json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveAs(blob, filename);
};