const saveData = (key: string, value: string): void => {
  if (localStorage) {
    localStorage.setItem(key, value)
  } else {
    alert('Web Storage is not supported')
  }
}

const loadData = (key: string): string | null => {
  if (localStorage) {
    if (key in localStorage) {
      return localStorage.getItem(key)
    }
  } else {
    alert('Web Storage is not supported')
  }
  return null
}

const deleteData = (key: string): void => {
  if (localStorage) {
    if (key in localStorage) {
      return localStorage.removeItem(key)
    }
  } else {
    alert('Web Storage is not supported')
  }
}

export { saveData, loadData, deleteData }
