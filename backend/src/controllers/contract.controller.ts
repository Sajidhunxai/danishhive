import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../config/database';

export const getAllContracts = async (req: AuthRequest, res: Response) => {
  try {
    const where: any = {
      OR: [
        { clientId: req.user!.id },
        { freelancerId: req.user!.id },
      ],
    };
    
    if (req.user!.isAdmin) {
      delete where.OR;
    }
    
    const contracts = await prisma.contract.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            profile: {
              select: {
                fullName: true,
                companyName: true,
                avatarUrl: true,
              },
            },
          },
        },
        freelancer: {
          select: {
            id: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        job: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    res.json({ contracts });
  } catch (error) {
    console.error('Get contracts error:', error);
    res.status(500).json({ error: 'Failed to fetch contracts' });
  }
};

export const getContractById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                companyName: true,
                avatarUrl: true,
              },
            },
          },
        },
        freelancer: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });
    
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    // Check authorization
    const isParty = contract.clientId === req.user!.id || contract.freelancerId === req.user!.id;
    const isAdmin = req.user!.isAdmin;
    
    if (!isParty && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view this contract' });
    }
    
    res.json({ contract });
  } catch (error) {
    console.error('Get contract error:', error);
    res.status(500).json({ error: 'Failed to fetch contract' });
  }
};

export const createContract = async (req: AuthRequest, res: Response) => {
  try {
    const {
      jobId,
      freelancerId,
      title,
      content,
      terms,
      paymentTerms,
      deadline,
      totalAmount,
    } = req.body;
    
    // Verify job exists and user is the client
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    if (job.clientId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to create contract for this job' });
    }
    
    // Generate contract number
    const contractCount = await prisma.contract.count();
    const contractNumber = `CONTRACT-${new Date().getFullYear()}-${String(contractCount + 1).padStart(4, '0')}`;
    
    const contract = await prisma.contract.create({
      data: {
        jobId,
        clientId: req.user!.id,
        freelancerId: freelancerId || null,
        contractNumber,
        title,
        content,
        terms,
        paymentTerms,
        deadline: deadline ? new Date(deadline) : null,
        totalAmount: totalAmount ? parseFloat(totalAmount) : null,
        status: 'draft',
      },
      include: {
        client: {
          select: {
            profile: {
              select: {
                fullName: true,
                companyName: true,
              },
            },
          },
        },
        freelancer: {
          select: {
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        job: {
          select: {
            title: true,
          },
        },
      },
    });
    
    res.status(201).json({ contract, message: 'Contract created successfully' });
  } catch (error) {
    console.error('Create contract error:', error);
    res.status(500).json({ error: 'Failed to create contract' });
  }
};

export const updateContract = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      terms,
      paymentTerms,
      deadline,
      totalAmount,
      status,
      freelancerId,
    } = req.body;
    
    // Find contract
    const existingContract = await prisma.contract.findUnique({
      where: { id },
    });
    
    if (!existingContract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    // Only client or admin can update
    if (existingContract.clientId !== req.user!.id && !req.user!.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to update this contract' });
    }
    
    // Cannot update signed contracts
    if (existingContract.status === 'signed' || existingContract.status === 'active') {
      return res.status(400).json({ error: 'Cannot update signed or active contracts' });
    }
    
    const contract = await prisma.contract.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(terms && { terms }),
        ...(paymentTerms && { paymentTerms }),
        ...(deadline && { deadline: new Date(deadline) }),
        ...(totalAmount && { totalAmount: parseFloat(totalAmount) }),
        ...(status && { status }),
        ...(freelancerId !== undefined && { freelancerId }),
      },
      include: {
        client: {
          select: {
            profile: {
              select: {
                fullName: true,
                companyName: true,
              },
            },
          },
        },
        freelancer: {
          select: {
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });
    
    res.json({ contract, message: 'Contract updated successfully' });
  } catch (error) {
    console.error('Update contract error:', error);
    res.status(500).json({ error: 'Failed to update contract' });
  }
};

export const signContract = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { signatureData } = req.body;
    
    // Find contract
    const existingContract = await prisma.contract.findUnique({
      where: { id },
    });
    
    if (!existingContract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    
    // Check if user is a party to the contract
    const isClient = existingContract.clientId === req.user!.id;
    const isFreelancer = existingContract.freelancerId === req.user!.id;
    
    if (!isClient && !isFreelancer) {
      return res.status(403).json({ error: 'Not authorized to sign this contract' });
    }
    
    // Check if already signed
    if (isClient && existingContract.clientSignatureDate) {
      return res.status(400).json({ error: 'You have already signed this contract' });
    }
    
    if (isFreelancer && existingContract.freelancerSignatureDate) {
      return res.status(400).json({ error: 'You have already signed this contract' });
    }
    
    const updateData: any = {};
    
    if (isClient) {
      updateData.clientSignatureDate = new Date();
      updateData.clientSignatureData = signatureData;
    }
    
    if (isFreelancer) {
      updateData.freelancerSignatureDate = new Date();
      updateData.freelancerSignatureData = signatureData;
    }
    
    // Check if both parties have signed
    const bothSigned = (
      (isClient || existingContract.clientSignatureDate) &&
      (isFreelancer || existingContract.freelancerSignatureDate)
    );
    
    if (bothSigned) {
      updateData.status = 'active';
    }
    
    const contract = await prisma.contract.update({
      where: { id },
      data: updateData,
    });
    
    res.json({ contract, message: 'Contract signed successfully' });
  } catch (error) {
    console.error('Sign contract error:', error);
    res.status(500).json({ error: 'Failed to sign contract' });
  }
};

