/* 
            <=========  Komunikacia s API    =========>
*/

/*   
    Funkcia ktora z API ziska zoznam krajin, berie argument page -> stranka v poradi (API pouziva paginaciu). 
    Vracia array, ktory ma na indexe 0 informacie o paginacii a indexe 1 data krajin 
*/
export const fetchCountriesByPage = async (page) => {
    let fetchedData = []

    await fetch(`https://api.worldbank.org/v2/country?format=json&page=${page}`)
        .then(response => { return response.json() })
        .then(data => fetchedData = data)

    return fetchedData
}

export const fetchIndicatorsByPage = async (page) => {
    let fetchedData = []

    await fetch(`https://api.worldbank.org/v2/indicator?format=json&page=${page}`)
        .then(response => { return response.json() })
        .then(data => fetchedData = data)

    return fetchedData
}

const fetchCountryData = async (code) => {
    let fetchedData = []
    await fetch(`https://api.worldbank.org/v2/country/${code}?format=json`)
        .then(response => { return response.json() })
        .then(data => fetchedData = data)
    return fetchedData[1][0]
}

export const fetchCountryIndicator = async (countryCode, indicatorId) => {
    let fetchedData = []
    await fetch(`https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicatorId}?format=json`)
        .then(response => { return response.json() })
        .then(data => fetchedData = data)

    if (fetchedData[1]) {
        return fetchedData[1][0]
    }

    return false
}

export const fetchCountryIndicators = async (code, indicatorCodes) => {
    const [countryData, ...indicators] = await Promise.all([
        fetchCountryData(code),
        ...indicatorCodes.map(indicator => fetchCountryIndicator(code, indicator))
    ])
    return [countryData, indicators]
}

export const fetchCountriesByQuery = async (query) => {
    const allCountries = await fetch(`https://api.worldbank.org/v2/country/all?format=json&per_page=300`)
        .then(response => { return response.json() })
        .then(data => { return data })
        .catch(err => console.log(err))

    const filteredResults = allCountries[1]
        .filter((country) => (country.name.toLowerCase().includes(query) ||
            country.capitalCity.toLowerCase().includes(query) || country.iso2Code.toLowerCase().includes(query)))
    return filteredResults
}

/* 
            <=========  Manipulacia dat    =========>
*/

export const parseToOnlyCountries = (resultsArray) => {
    return resultsArray.filter((country) => country.capitalCity !== '')
}

export const getCountryByCode = (countryArray, code) => {
    return countryArray.find((country) => country.iso2Code === code)
}

export const getIndicatorById = (indicatorArray, id) => {
    return indicatorArray.find((indicator) => indicator.id === id)
}

export const addNoteToSavedCountry = (code, note) => {
    const arrFromLocalStorage = JSON.parse(window.localStorage.favoriteCountries)

    if (!arrFromLocalStorage) return

    arrFromLocalStorage.forEach((country) => { if (country.iso2Code == code) country.notes = note })
    console.log(arrFromLocalStorage, code, note)
    window.localStorage.favoriteCountries = JSON.stringify(arrFromLocalStorage)
}

export const saveCountryToFavourites = (country) => {
    const countryToSave = { ...country, notes: '' }
    const savedCountries = window.localStorage.favoriteCountries

    if (savedCountries) {
        const arrFromLocalStorage = JSON.parse(savedCountries)
        if (arrFromLocalStorage.find((lsCountry) => lsCountry.iso2Code === countryToSave.iso2Code)) return
        arrFromLocalStorage.push(countryToSave)
        window.localStorage.favoriteCountries = JSON.stringify(arrFromLocalStorage)
    } else {
        window.localStorage.favoriteCountries = JSON.stringify([countryToSave])
    }

    console.log(window.localStorage)
}

export const saveIndicator = (indicator) => {
    const savedIndicators = window.localStorage.favoriteIndicators

    if (savedIndicators) {
        const arrFromLocalStorage = JSON.parse(savedIndicators)
        if (arrFromLocalStorage.find((lsIndicator) => lsIndicator === indicator)) return
        arrFromLocalStorage.push(indicator)
        window.localStorage.favoriteIndicators = JSON.stringify(arrFromLocalStorage)
    } else {
        window.localStorage.favoriteIndicators = JSON.stringify([indicator])
    }

    console.log(window.favoriteIndicators)
}

export const deleteCountryFromFavorites = (code) => {
    const savedCountries = window.localStorage.favoriteCountries
    if (savedCountries) {
        const arrFromLocalStorage = JSON.parse(savedCountries).filter((lsCountry) => lsCountry.iso2Code !== code)
        console.log(arrFromLocalStorage)
        window.localStorage.favoriteCountries = JSON.stringify(arrFromLocalStorage)
    } else {
        window.localStorage.favoriteCountries = JSON.stringify([])
    }
}

export const deleteIndicator = (indicator) => {
    const savedIndicators = window.localStorage.favoriteIndicators
    if (savedIndicators) {
        const arrFromLocalStorage = JSON.parse(savedIndicators).filter((lsIndicator) => lsIndicator !== indicator)
        window.localStorage.favoriteIndicators = JSON.stringify(arrFromLocalStorage)
    } else {
        window.localStorage.favoriteIndicators = JSON.stringify([])
    }
}

export const getSavedFavoriteCountries = () => {
    const savedCountries = window.localStorage.favoriteCountries

    if (!savedCountries) {
        return []
    }

    return JSON.parse(savedCountries)
}

export const getSavedFavoriteCountriesCodes = () => {
    const savedCountries = window.localStorage.favoriteCountries

    if (!savedCountries) {
        return []
    }

    return JSON.parse(savedCountries).map((country) => country.iso2Code)
}

export const getSavedIndicators = () => {
    const savedIndicators = window.localStorage.favoriteIndicators

    if (!savedIndicators) {
        const defaultIndicators = [
            'NY.GDP.MKTP.CD', 'NE.EXP.GNFS.ZS', 'NY.GDP.PCAP.CD', 'NY.GDP.MKTP.KD.ZG', 'FP.CPI.TOTL.ZG'
        ] 
        window.localStorage.favoriteIndicators = JSON.stringify(defaultIndicators);
        return defaultIndicators
    } 

    return JSON.parse(savedIndicators)
}