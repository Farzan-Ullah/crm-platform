import {
  getUsersList,
  createNewUser,
  updateUserById,
  getActiveSalesReps,
} from '../services/userService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getUsers = async (req, res, next) => {
  try {
    const { role, teamId, isActive } = req.query;
    const users = await getUsersList({
      tenantId: req.tenantId,
      role,
      teamId,
      isActive,
    });
    return sendSuccess(res, 'Users fetched successfully', users);
  } catch (err) {
    return next(err);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const user = await createNewUser({
      tenantId: req.tenantId,
      data: req.body,
      actorId: req.user._id,
      ip,
      userAgent,
    });

    return sendSuccess(res, 'User created successfully', user, 201);
  } catch (err) {
    return next(err);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const user = await updateUserById({
      userId: req.params.id,
      tenantId: req.tenantId,
      updates: req.body,
      actorId: req.user._id,
      ip,
      userAgent,
    });

    return sendSuccess(res, 'User updated successfully', user);
  } catch (err) {
    return next(err);
  }
};

export const getSalesReps = async (req, res, next) => {
  try {
    const reps = await getActiveSalesReps(req.tenantId);
    return sendSuccess(res, 'Sales representatives fetched successfully', reps);
  } catch (err) {
    return next(err);
  }
};
