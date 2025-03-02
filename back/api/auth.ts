import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import { Logger } from 'winston';
import * as fs from 'fs';
import config from '../config';
import AuthService from '../services/auth';
import { celebrate, Joi } from 'celebrate';
const route = Router();

export default (app: Router) => {
  app.use('/', route);
  route.post(
    '/login',
    celebrate({
      body: Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required(),
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger');
      try {
        const authService = Container.get(AuthService);
        const data = await authService.login({ ...req.body }, req);
        return res.send(data);
      } catch (e) {
        logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );

  route.post(
    '/logout',
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger');
      try {
        fs.readFile(config.authConfigFile, 'utf8', function (err, data) {
          if (err) console.log(err);
          const authInfo = JSON.parse(data);
          fs.writeFileSync(
            config.authConfigFile,
            JSON.stringify({
              ...authInfo,
              token: '',
            }),
          );
          res.send({ code: 200 });
        });
      } catch (e) {
        logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );

  route.post(
    '/user',
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger');
      try {
        const content = fs.readFileSync(config.authConfigFile, 'utf8');
        fs.writeFile(
          config.authConfigFile,
          JSON.stringify({ ...JSON.parse(content || '{}'), ...req.body }),
          (err) => {
            if (err) console.log(err);
            res.send({ code: 200, message: '更新成功' });
          },
        );
      } catch (e) {
        logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );

  route.get(
    '/user',
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger');
      try {
        const authService = Container.get(AuthService);
        const authInfo = await authService.getUserInfo();
        res.send({
          code: 200,
          data: {
            username: authInfo.username,
            twoFactorActived: authInfo.twoFactorActived,
          },
        });
      } catch (e) {
        logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );

  route.get(
    '/user/two-factor/init',
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger');
      try {
        const authService = Container.get(AuthService);
        const data = await authService.initTwoFactor();
        res.send({ code: 200, data });
      } catch (e) {
        logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );

  route.put(
    '/user/two-factor/active',
    celebrate({
      body: Joi.object({
        code: Joi.string().required(),
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger');
      try {
        const authService = Container.get(AuthService);
        const data = await authService.activeTwoFactor(req.body.code);
        res.send({ code: 200, data });
      } catch (e) {
        logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );

  route.put(
    '/user/two-factor/deactive',
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger');
      try {
        const authService = Container.get(AuthService);
        const data = await authService.deactiveTwoFactor();
        res.send({ code: 200, data });
      } catch (e) {
        logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );

  route.put(
    '/user/two-factor/login',
    celebrate({
      body: Joi.object({
        code: Joi.string().required(),
      }),
    }),
    async (req: Request, res: Response, next: NextFunction) => {
      const logger: Logger = Container.get('logger');
      try {
        const authService = Container.get(AuthService);
        const data = await authService.twoFactorLogin(req.body);
        res.send(data);
      } catch (e) {
        logger.error('🔥 error: %o', e);
        return next(e);
      }
    },
  );
};
