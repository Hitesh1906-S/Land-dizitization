import { prisma } from '../config/database';
import { NotFoundError, ConflictError } from '../utils/AppError';
import { LocationDTO } from '@land-digitization/shared';

export class LocationService {
  static async getAllLocations() {
    const locations = await prisma.location.findMany({
      orderBy: [{ district: 'asc' }, { village: 'asc' }],
    });
    return locations.map(this.mapToDTO);
  }

  static async getLocationById(id: string) {
    const loc = await prisma.location.findUnique({ where: { id } });
    if (!loc) throw new NotFoundError(`Location with ID ${id} not found`);
    return this.mapToDTO(loc);
  }

  static async createLocation(data: {
    state?: string;
    district: string;
    tehsil: string;
    subDivision?: string;
    village: string;
    censusCode?: string;
    pincode?: string;
  }) {
    const state = data.state || 'Rajasthan';
    const existing = await prisma.location.findUnique({
      where: {
        state_district_tehsil_village: {
          state,
          district: data.district,
          tehsil: data.tehsil,
          village: data.village,
        },
      },
    });

    if (existing) {
      throw new ConflictError(`Location already registered for village ${data.village} in ${data.tehsil}, ${data.district}`);
    }

    const created = await prisma.location.create({
      data: {
        state,
        district: data.district,
        tehsil: data.tehsil,
        subDivision: data.subDivision,
        village: data.village,
        censusCode: data.censusCode,
        pincode: data.pincode,
      },
    });

    return this.mapToDTO(created);
  }

  static mapToDTO(loc: any): LocationDTO {
    return {
      id: loc.id,
      state: loc.state,
      district: loc.district,
      tehsil: loc.tehsil,
      subDivision: loc.subDivision,
      village: loc.village,
      censusCode: loc.censusCode,
      pincode: loc.pincode,
      createdAt: loc.createdAt.toISOString(),
      updatedAt: loc.updatedAt.toISOString(),
    };
  }
}
