'use strict';

var logger = require('../../core/logger');
var followModule = require('../../core/user/follow');
var denormalizeUser = require('../denormalize/user').denormalize;
var q = require('q');

var DEFAULT_LIMIT = 10;
var DEFAULT_OFFSET = 0;

function denormalize(data) {
  const denormalizeOptions = {
    includeIsFollowing: true,
    includeFollow: true
  };
  var promises = data.map(function(item) {
    return denormalizeUser(item.user, denormalizeOptions).then(function(result) {
      item.user = result;
      return item;
    }, function(err) {
      logger.error('Error on denormalize', err);
      delete item.user;
      return item;
    });
  });
  return q.all(promises);
}

function follow(req, res) {
  followModule.follow(req.user, req.following).then(function(result) {
    res.status(201).json(result);
  }, function(err) {
    const details = 'Error while following user';

    logger.error(details, err);
    res.status(500).json({error: {code: 500, message: 'Server Error', details}});
  });
}
module.exports.follow = follow;

function unfollow(req, res) {
  followModule.unfollow(req.user, req.following).then(function() {
    res.status(204).end();
  }, function(err) {
    const details = 'Error while unfollowing user';

    logger.error(details, err);
    res.status(500).json({error: {code: 500, message: 'Server Error', details}});
  });
}
module.exports.unfollow = unfollow;

function getPaginationOptions(req) {
  return { offset: +req.query.offset || DEFAULT_OFFSET, limit: +req.query.limit || DEFAULT_LIMIT };
}

function getFollowers(req, res) {
  const pagination = getPaginationOptions(req);

  followModule.getFollowers({_id: req.params.id}, pagination)
    .then(result => {
      res.header('X-ESN-Items-Count', result.total_count);

      return result.list || [];
    })
    .then(denormalize)
    .then(denormalized => res.status(200).json(denormalized || []))
    .catch(err => {
      const details = 'Error while getting followers';

      logger.error(details, err);
      res.status(500).json({error: {code: 500, message: 'Server Error', details}});
    });
}
module.exports.getFollowers = getFollowers;

function getFollowersHeaders(req, res) {
  followModule.countFollowers({_id: req.params.id})
    .then(count => {
      res.header('X-ESN-Items-Count', count || 0);
      res.status(200).send();
    })
    .catch(err => {
      const details = 'Error while counting followers';

      logger.error(details, err);
      res.status(500).json({error: {code: 500, message: 'Server Error', details}});
    });
}
module.exports.getFollowersHeaders = getFollowersHeaders;

function getFollowings(req, res) {
  const pagination = getPaginationOptions(req);

  followModule.getFollowings({_id: req.params.id}, pagination)
    .then(result => {
      res.header('X-ESN-Items-Count', result.total_count);

      return result.list || [];
    })
    .then(denormalize)
    .then(denormalized => res.status(200).json(denormalized || []))
    .catch(err => {
      const details = 'Error while getting followings';

      logger.error(details, err);
      res.status(500).json({error: {code: 500, message: 'Server Error', details}});
    });
}
module.exports.getFollowings = getFollowings;

function getFollowingsHeaders(req, res) {
  followModule.countFollowings({_id: req.params.id})
    .then(count => {
      res.header('X-ESN-Items-Count', count || 0);
      res.status(200).send();
    })
    .catch(err => {
      const details = 'Error while counting followings';

      logger.error(details, err);
      res.status(500).json({error: {code: 500, message: 'Server Error', details}});
    });
}
module.exports.getFollowingsHeaders = getFollowingsHeaders;

function isFollowing(req, res) {
  followModule.follows({_id: req.params.id}, {_id: req.params.tid}).then(function(result) {
    if (result) {
      return res.status(204).end();
    }
    res.status(404).end();
  }, function(err) {
    const details = 'Error while getting following status';

    logger.error(details, err);
    res.status(500).json({error: {code: 500, message: 'Server Error', details}});
  });
}
module.exports.isFollowing = isFollowing;
