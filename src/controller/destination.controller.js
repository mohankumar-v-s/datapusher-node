const { Destination } = require('../models');
const { destinationSchema, destinationUpdateSchema } = require('../utils/validationSchema');
const controller = {}

controller.createDestination = async (req, res) => {
    const account_id = req.params.accountId
    const { error, value } = destinationSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ 
            success: false,
            message: 'Validation error', 
            details: error.details[0].message 
        });
    }
    const { url, http_method, headers } = value;

    try {
        const destination = await Destination.create({
            account_id,
            url,
            method: http_method,
            headers,
            created_by: req.user.userId,
            updated_by: req.user.userId
        });
        res.json({
            success: true,
            message: "Create a Destination Successfully",
            data: destination
        });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
}

controller.getAllDestination = async (req, res) => {
    try {
        const destinations = await Destination.findAll({
            where: { account_id: req.params.accountId }
        });

        res.json({
            success: true,
            message: "Fetched All Destinations Successfully",
            data: destinations
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
    }
}

controller.getDestinationByID = async (req, res) => {
    try {
        const destination = await Destination.findByPk(req.params.id);

        if (!destination) {
            return res.status(404).json({ success: false, message: 'Destination not found' });
        }
        res.json({
            success: true,
            message: "Fetched Destination Successfully",
            data: destination
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed To Get Destination', error: error.message });
    }
}

controller.updateDestinationById = async (req, res) => {
    try {
        const destination = await Destination.findByPk(req.params.id);

        if (!destination) {
            return res.status(404).json({ success: false, message: 'Destination not found' });
        }

        const { error, value } = destinationUpdateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ success: false, message: 'Validation error', details: error.details[0].message });
        }

        const updated_by = req.user.userId;

        await destination.update({
            ...value,
            updated_by,
        });

        return res.json({
            success: true,
            message: "Updated destination successfully",
            data: destination,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error updating destination', error: error.message });
    }
};

controller.deleteDestinationById = async (req, res) => {
    try {
        const dest = await Destination.findByPk(req.params.id);
        if (!dest) {
            return res.status(404).json({ success: false, message: 'Destination not found' });
        }
        await dest.destroy();
        res.json({ success: true, message: 'Destination deleted Successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error Deleting Destination', error: error.message });
    }
}

module.exports = controller