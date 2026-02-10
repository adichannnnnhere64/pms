import React, { useState } from 'react';
import {
  Container,
  Navbar,
  Nav,
  NavDropdown,
  Button,
  Form,
  Table,
  Card,
  Alert,
  Modal,
  Badge,
  Spinner,
  ProgressBar,
  ListGroup,
  Accordion,
} from 'react-bootstrap';

export default function BootstrapPlayground() {
  const [showModal, setShowModal] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  return (
    <div>
      {/* ================= Navbar ================= */}
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand href="#">React-Bootstrap 5 Playground</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#">Home</Nav.Link>
              <Nav.Link href="#">Features</Nav.Link>
              <NavDropdown title="Dropdown" id="basic-nav-dropdown">
                <NavDropdown.Item href="#">Action</NavDropdown.Item>
                <NavDropdown.Item href="#">Another action</NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item href="#">Something else</NavDropdown.Item>
              </NavDropdown>
            </Nav>
            <Form className="d-flex">
              <Form.Control type="search" placeholder="Search" className="me-2" />
              <Button variant="outline-success">Search</Button>
            </Form>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container>
        {/* ================= Alerts ================= */}
        {showAlert && (
          <Alert variant="info" onClose={() => setShowAlert(false)} dismissible>
            This is an info alert—click the X to dismiss!
          </Alert>
        )}

        {/* ================= Buttons ================= */}
        <div className="mb-3">
          <Button variant="primary" className="me-2">
            Primary
          </Button>
          <Button variant="secondary" className="me-2">
            Secondary
          </Button>
          <Button variant="success" className="me-2">
            Success
          </Button>
          <Button variant="warning" className="me-2">
            Warning
          </Button>
          <Button variant="danger" className="me-2">
            Danger
          </Button>
          <Button variant="info" className="me-2">
            Info
          </Button>
          <Button variant="light" className="me-2">
            Light
          </Button>
          <Button variant="dark" className="me-2">
            Dark
          </Button>
          <Button variant="link" onClick={() => setShowModal(true)}>
            Open Modal
          </Button>
        </div>

        {/* ================= Forms ================= */}
        <Form className="mb-4">
          <Form.Group className="mb-3" controlId="formEmail">
            <Form.Label>Email address</Form.Label>
            <Form.Control type="email" placeholder="Enter email" />
            <Form.Text className="text-muted">We'll never share your email.</Form.Text>
          </Form.Group>
          <Form.Group className="mb-3" controlId="formPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" placeholder="Password" />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formCheckbox">
            <Form.Check type="checkbox" label="Check me out" />
          </Form.Group>
          <Button variant="primary" type="submit">
            Submit
          </Button>
        </Form>

        {/* ================= Table ================= */}
        <h4>Sample Table</h4>
        <Table striped bordered hover responsive className="mb-4">
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

        {/* ================= Cards ================= */}
        <Card className="mb-4" style={{ width: '18rem' }}>
          <Card.Body>
            <Card.Title>Card Title</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">Card Subtitle</Card.Subtitle>
            <Card.Text>This is a simple card example with React-Bootstrap.</Card.Text>
            <Button variant="primary">Go somewhere</Button>
          </Card.Body>
        </Card>

        {/* ================= Badges & Spinner ================= */}
        <div className="mb-4">
          <h5>
            Notifications <Badge bg="secondary">4</Badge>
          </h5>
          <Spinner animation="border" variant="primary" className="me-2" />
          <Spinner animation="grow" variant="success" />
        </div>

        {/* ================= Progress Bar ================= */}
        <ProgressBar now={60} label="60%" className="mb-4" />

        {/* ================= ListGroup ================= */}
        <ListGroup className="mb-4">
          <ListGroup.Item>Cras justo odio</ListGroup.Item>
          <ListGroup.Item>Dapibus ac facilisis in</ListGroup.Item>
          <ListGroup.Item>Morbi leo risus</ListGroup.Item>
        </ListGroup>

        {/* ================= Accordion ================= */}
        <Accordion defaultActiveKey="0" className="mb-4">
          <Accordion.Item eventKey="0">
            <Accordion.Header>Accordion Item #1</Accordion.Header>
            <Accordion.Body>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer
              posuere erat a ante.
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="1">
            <Accordion.Header>Accordion Item #2</Accordion.Header>
            <Accordion.Body>
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>

        {/* ================= Modal ================= */}
        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>React-Bootstrap Modal</Modal.Title>
          </Modal.Header>
          <Modal.Body>This is a sample modal for testing purposes.</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Close
            </Button>
            <Button variant="primary" onClick={() => setShowModal(false)}>
              Save Changes
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
}

