const { Log, Account, Destination } = require('../models');
const controller = {};

controller.getLogs = async (req, res) => {
    try {
        const account_id = req.params.accountId;
        const {
            limit = 50,
            offset = 0,
            status,
            startDate,
            endDate
        } = req.query;

        const whereClause = { account_id };

        if (status) {
            whereClause.status = status;
        }

        if (startDate && endDate) {
            whereClause.processed_timestamp = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }

        const { count, rows: logs } = await Log.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Destination,
                    as: 'destination',
                    attributes: ['url', 'method']
                }
            ],
            order: [['processed_timestamp', 'DESC']],
            limit: parseInt(limit, 10),
            offset: parseInt(offset, 10)
        });

        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    total: count,
                    limit: parseInt(limit, 10),
                    offset: parseInt(offset, 10),
                    pages: Math.ceil(count / limit)
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching logs',
            error: error.message
        });
    }
};

controller.getLogById = async (req, res) => {
    try {
        const { eventId } = req.params;
        const account_id = req.params.accountId;

        const log = await Log.findOne({
            where: {
                event_id: eventId,
                account_id
            },
            include: [
                {
                    model: Destination,
                    as: 'destination',
                    attributes: ['url', 'method', 'headers']
                }
            ]
        });

        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Log not found'
            });
        }

        res.json({
            success: true,
            data: log
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching log details',
            error: error.message
        });
    }
};

module.exports = controller;