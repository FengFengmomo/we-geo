class A{

}

class B extends A{
    
}

class C extends B{
    
}

let c = new C();
console.log(c instanceof A); // true
console.log(c instanceof B); // true
console.log(c instanceof C); // true
console.log(typeof c); // object