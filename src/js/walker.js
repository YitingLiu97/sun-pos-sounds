//later create this for visuals or use touch designer with max?
//mouse position controls the wind direction
//music controls the mass - gravity = mass * accelartion

class Walker {
  constructor(x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);


  }

  applyForce(force, mass) {
    // let v2 = p5.Vector.mult(force, mass);

    this.acc.add(force.mult(mass));
    // return v2;


  }

  edges() {
    if (this.pos.x >= width) {

      this.pos.x = width;
      this.vel.x *= -1;

    } else if (this.pos.x <= 0) {

      this.pos.x = random(width / 2);
      this.vel.x *= -1;

    }
    if (this.pos.y >= height) {

      this.pos.y = height;
      this.vel.y *= -1;

    } else if (this.pos.y <= 0) {

      this.pos.y = random(height / 2);
      this.vel.y *= -1;

    }
  }

  update() {

    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.acc.set(0, 0);

  }

  display(r, col) {
    // display() {
    // fill(col,col,col);
    // stroke(255);
    strokeWeight(r/40);
  // noFill();
    fill(255);
    ellipse(this.pos.x, this.pos.y, r, r);
    // this.r = r;

  }
}