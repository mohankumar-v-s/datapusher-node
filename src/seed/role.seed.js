const { Role } = require('../models'); // adjust if your Role model path is different

async function createDefaultRoles() {
  await Role.findOrCreate({ where: { role_name: 'Admin' } });
  await Role.findOrCreate({ where: { role_name: 'User' } });

  console.log('Roles Admin and User ensured.');
}

createDefaultRoles();
