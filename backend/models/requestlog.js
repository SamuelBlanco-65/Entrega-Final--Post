'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RequestLog extends Model {
    static associate() {
      // sin asociaciones
    }
  }

  RequestLog.init(
    {
      method: DataTypes.STRING(10),
      path: DataTypes.STRING(255),
      ip: DataTypes.STRING(45),
      statusCode: DataTypes.INTEGER,
    },
    { sequelize, modelName: 'RequestLog', tableName: 'RequestLogs' }
  );

  return RequestLog;
};
