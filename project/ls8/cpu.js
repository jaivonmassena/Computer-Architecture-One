
const LDI = 0b10011001;
const PRN = 0b01000011;
const HLT = 0b00000001;
const MUL = 0b10101010;
const ADD = 0b10101000;
const POP = 0b01001100;
const PUSH = 0b01001101;
const CALL = 0b01001000;
const JMP = 0b01010000;
const DEC = 0b01111001;
const RET = 0b00001001;
const CMP = 0b10100000;
const JEQ = 0b01010001;
const JNE = 0b01010010;
const SP = 7;
/**
 * Class for simulating a simple Computer (CPU & memory)
 */

const FL_L = 0x1 << 2;
const FL_G = 0x1 << 1;
const FL_E = 0x1 << 0;

class CPU {

    /**
     * Initialize the CPU
     */
    constructor(ram) {
        this.ram = ram;

        this.reg = new Array(8).fill(0); // General-purpose registers R0-R7
        this.reg[SP] = 0xF4
        // Special-purpose registers
        this.PC = 0; // Program Counter
        this.reg.FL = 0b00000000;

    }

    /**
     * Store value in memory address, useful for program loading
     */
    poke(address, value) {
        this.ram.write(address, value);
    }

    /**
     * Starts the clock ticking on the CPU
     */
    startClock() {
        this.clock = setInterval(() => {
            this.tick();
        }, 1); // 1 ms delay == 1 KHz clock == 0.000001 GHz
    }

    /**
     * Stops the clock
     */
    stopClock() {
        clearInterval(this.clock);
    }

    /**
     * ALU functionality
     *
     * The ALU is responsible for math and comparisons.
     *
     * If you have an instruction that does math, i.e. MUL, the CPU would hand
     * it off to it's internal ALU component to do the actual work.
     *
     * op can be: ADD SUB MUL DIV INC DEC CMP
     */
    alu(op, regA, regB) {
        switch (op) {
            case 'MUL':
                // !!! IMPLEMENT ME
                this.reg[regA] = this.reg[regA] * this.reg[regB];
            break;
            case 'ADD':
                this.reg[regA] += this.reg[regB];
            break;


        }
    }

    /**
     * Advances the CPU one cycle
     */
    tick() {
        // Load the instruction register (IR--can just be a local variable here)
        // from the memory address pointed to by the PC. (I.e. the PC holds the
        // index into memory of the instruction that's about to be executed
        // right now.)
        const IR = this.ram.read(this.PC);

        // Debugging output
        //console.log(`${this.PC}: ${IR.toString(2)}`);

        // Get the two bytes in memory _after_ the PC in case the instruction
        // needs them.
        const pushV= (v) =>{
          this.reg[SP]--;
          this.ram.write(this.reg[SP], v);
        }
        const pop = () => {

          this.reg[SP]++;
          return this.ram.read(this.reg[SP]);;
        };
        const operandA = this.ram.read(this.PC + 1);
        const operandB = this.ram.read(this.PC + 2);

        // Execute the instruction. Perform the actions for the instruction as
        // outlined in the LS-8 spec.
        let pcAdvance = true;
        switch(IR) {

          case LDI:
            this.reg[operandA] = operandB;
            break;
          case MUL:
            this.alu('MUL', operandA, operandB);
            break;
          case ADD:
            this.alu('ADD', operandA, operandB);
            break;
          case PUSH:
            pushV(this.reg[operandA]);
            break;
          case POP:
            this.reg[operandA] = pop();
            break;
          case CALL:
            pcAdvance = false;
            pushV(this.reg.PC + 2);
            this.reg.PC = this.reg[operandA];
            break;
          case JMP:
            pcAdvance = false;
            this.reg.PC = this.reg[operandA];
            break;
          case RET:
            pcAdvance = false;
            this.reg.PC = this.ram.read(this.reg[SP]);
            this.reg[SP]++;
            break;

            this.reg.FL = pop();
            this.reg.PC = pop();
            break;
          case PRN:
            console.log(this.reg[operandA]);
            break;

          case CMP:
            if (this.reg[operandA] === this.reg[operandB]) this.reg.FL |= FL_E;
            else this.reg.FL &= ~FL_E;
            if (this.reg[operandA] < this.reg[operandB]) this.reg.FL |= FL_L;
            else this.reg.FL &= ~FL_L;
            if (this.reg[operandA] > this.reg[operandB]) this.reg.FL |= FL_G;
            else this.reg.FL &= ~FL_G;
            break;
          case JEQ:
            if ((this.reg.FL &= 0b00000001) === 0b1) {
              pcAdvance = false;
              this.reg.PC = this.reg[operandA];
            }
            break;
          case JNE:
            if ((this.reg.FL &= 0b00000001) === 0b0) {
              pcAdvance = false;
              this.reg.PC = this.reg[operandA];
            }
            break;
          // case ST:
          //   this.ram.write(this.reg[operandA], this.reg[operandB]);
          //   break;
          case HLT:
            this.stopClock();
            break;
           default:
              console.log("Unknown instruction: " + IR.toString(2));
              this.stopClock();
              return;

        }

        // Increment the PC register to go to the next instruction. Instructions
        // can be 1, 2, or 3 bytes long. Hint: the high 2 bits of the
        // instruction byte tells you how many bytes follow the instruction byte
        // for any particular instruction.
        if(pcAdvance){
          const instLen = (IR >> 6) + 1;
          this.PC += instLen;
      }
    }

}

module.exports = CPU;
