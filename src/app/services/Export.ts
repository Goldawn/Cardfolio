import { saveAs } from 'file-saver'

export const exportToJSON = (data: any, filename: string = 'cards.json'): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  saveAs(blob, filename)
}
