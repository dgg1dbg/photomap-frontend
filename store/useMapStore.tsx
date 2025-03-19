import {create} from 'zustand';

export const useMapStore = create((set) => ({
    map: "positron",
    setMap: (map) => set({map}),
}));