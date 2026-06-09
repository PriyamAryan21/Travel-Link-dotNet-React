// Client/src/services/tripService.ts

import type { CreateTripDto, TripDto } from "../types"
import api, { unwrap } from "./api"

export const tripService = {

    getMyTrips: () =>
        unwrap<TripDto[]>(api.get('/trips')),
    getTripById: (tripId: string) =>
        unwrap<TripDto>(api.get(`/trips/get/${tripId}`)),
    getTripsByGroup: (groupId: string) =>
        unwrap<TripDto[]>(api.get(`/trips/getByGroup/${groupId}`)),
    createTrip: (data: CreateTripDto) =>
        unwrap<TripDto>(api.post('/trips/create', data)),
    deleteTrip: (tripId: string) =>
        unwrap<string>(api.delete(`/trips/delete/${tripId}`))
};
