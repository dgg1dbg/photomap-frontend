import {create} from 'zustand';

interface MapState {
    map: string;
    setMap: (map: string) => void;
}

export const useMapStore = create<MapState>((set) => ({
    map: "positron",
    setMap: (map) => set({map}),
}));