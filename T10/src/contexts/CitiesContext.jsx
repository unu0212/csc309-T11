import { createContext, useContext, useState, useRef } from "react";

export const CitiesContext = createContext();

export const CitiesProvider = ({ children }) => {
    const [cities, _setCities] = useState([
        { id: 1, name: "Toronto", latitude: 43.70011, longitude: -79.4163 }
    ]);
    const nextId = useRef(2);
    // TODO: complete me
    // HINT: it may be good to provide addCity and removeCity functions
    const removeCity = (cityId) => {
        _setCities(cities.filter((city) => city.id !== cityId));
    };

    const addCity = (name, latitude, longitude) => {
        _setCities([
            ...cities,
            {
                id: nextId.current ++,
                name,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude)
            }
        ]);
    };

    return (
        <CitiesContext.Provider value={{ cities, addCity, removeCity }}>
            {children}
        </CitiesContext.Provider>
    );
};

export const useCities = () => {
    return useContext(CitiesContext);
};
