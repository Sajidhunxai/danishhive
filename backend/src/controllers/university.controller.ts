import { Response, Request } from 'express';
import prisma from '../config/database';

// This endpoint doesn't require authentication (public data)
export const getUniversities = async (req: Request, res: Response) => {
  try {
    // Fetch universities from database
    const universities = await (prisma as any).university.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // If no universities exist in database, seed with default Danish universities
    if (universities.length === 0) {
      const defaultUniversities = [
        { name: 'Københavns Universitet', city: 'København', type: 'University' },
        { name: 'Aarhus Universitet', city: 'Aarhus', type: 'University' },
        { name: 'Aalborg Universitet', city: 'Aalborg', type: 'University' },
        { name: 'Syddansk Universitet', city: 'Odense', type: 'University' },
        { name: 'Roskilde Universitet', city: 'Roskilde', type: 'University' },
        { name: 'IT-Universitetet i København', city: 'København', type: 'University' },
        { name: 'Danmarks Tekniske Universitet', city: 'Kongens Lyngby', type: 'University' },
        { name: 'Copenhagen Business School', city: 'København', type: 'Business School' },
      ];

      await (prisma as any).university.createMany({
        data: defaultUniversities
      });

      // Fetch again after seeding
      const seededUniversities = await (prisma as any).university.findMany({
        where: {
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      return res.json({ universities: seededUniversities });
    }

    res.json({ universities });
  } catch (error: unknown) {
    console.error('Error fetching universities:', error);
    res.status(500).json({ 
      error: 'Failed to fetch universities',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

