import MainNavbar from '@/components/MainNavbar';
import { Table, Container } from 'react-bootstrap';
import AppLayout from '@/layouts/app-layout';

interface LoginProps {
  status?: string;
  canResetPassword: boolean;
}

export default function Login({ status, canResetPassword }: LoginProps) {
  return (
    <div>
      <AppLayout>
        <h2>Sample Table</h2>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Adrian Radores</td>
              <td>adrian@example.com</td>
              <td>Admin</td>
              <td>Active</td>
            </tr>
            <tr>
              <td>2</td>
              <td>Jane Doe</td>
              <td>jane@example.com</td>
              <td>User</td>
              <td>Inactive</td>
            </tr>
            <tr>
              <td>3</td>
              <td>John Smith</td>
              <td>john@example.com</td>
              <td>Editor</td>
              <td>Active</td>
            </tr>
          </tbody>
        </Table>
      </AppLayout>
    </div>
  );
}

