import {
  getTeamsList,
  createNewTeam,
  updateTeamById,
  deleteTeamById,
} from '../services/teamService.js';
import { sendSuccess } from '../utils/apiResponse.js';

export const getTeams = async (req, res, next) => {
  try {
    const teams = await getTeamsList(req.tenantId);
    return sendSuccess(res, 'Teams fetched successfully', teams);
  } catch (err) {
    return next(err);
  }
};

export const createTeam = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const team = await createNewTeam({
      tenantId: req.tenantId,
      data: req.body,
      actorId: req.user._id,
      ip,
      userAgent,
    });

    return sendSuccess(res, 'Team created successfully', team, 201);
  } catch (err) {
    return next(err);
  }
};

export const updateTeam = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const team = await updateTeamById({
      teamId: req.params.id,
      tenantId: req.tenantId,
      updates: req.body,
      actorId: req.user._id,
      ip,
      userAgent,
    });

    return sendSuccess(res, 'Team updated successfully', team);
  } catch (err) {
    return next(err);
  }
};

export const deleteTeam = async (req, res, next) => {
  try {
    await deleteTeamById({
      teamId: req.params.id,
      tenantId: req.tenantId,
      actorId: req.user._id,
    });

    return sendSuccess(res, 'Team deleted successfully');
  } catch (err) {
    return next(err);
  }
};
